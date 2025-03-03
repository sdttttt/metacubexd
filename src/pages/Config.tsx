import { createForm } from '@felte/solid'
import { validator } from '@felte/validator-zod'
import { useI18n } from '@solid-primitives/i18n'
import { useNavigate } from '@solidjs/router'
import {
  For,
  Show,
  createEffect,
  createResource,
  createSignal,
  onMount,
} from 'solid-js'
import { z } from 'zod'
import {
  fetchBackendConfigAPI,
  fetchBackendVersionAPI,
  flushFakeIPDataAPI,
  flushingFakeIPData,
  reloadConfigFileAPI,
  reloadingConfigFile,
  restartBackendAPI,
  restartingBackend,
  updateBackendConfigAPI,
  updateGEODatabasesAPI,
  updatingGEODatabases,
  upgradeBackendAPI,
  upgradingBackend,
} from '~/apis'
import { Button, ConfigTitle } from '~/components'
import { LANG, MODE_OPTIONS, ROUTES, themes } from '~/constants'
import {
  autoSwitchTheme,
  favDayTheme,
  favNightTheme,
  setAutoSwitchTheme,
  setFavDayTheme,
  setFavNightTheme,
  setSelectedEndpoint,
  setUseTwemoji,
  useRequest,
  useTwemoji,
} from '~/signals'
import type { DNSQuery } from '~/types'

const dnsQueryFormSchema = z.object({
  name: z.string(),
  type: z.string(),
})

const DNSQueryForm = () => {
  const [t] = useI18n()
  const request = useRequest()

  const { form, isSubmitting } = createForm<z.infer<typeof dnsQueryFormSchema>>(
    {
      extend: validator({ schema: dnsQueryFormSchema }),
      onSubmit: async (values) => {
        request
          .get('dns/query', {
            searchParams: { name: values.name, type: values.type },
          })
          .json<DNSQuery>()
          .then(({ Answer }) =>
            setDNSQueryResult(Answer?.map(({ data }) => data) || []),
          )
      },
    },
  )

  const [DNSQueryResult, setDNSQueryResult] = createSignal<string[]>([])

  return (
    <div class="flex flex-col">
      <form use:form={form} class="flex gap-2 sm:flex-row">
        <input
          type="search"
          name="name"
          class="input input-bordered min-w-0 flex-1"
        />

        <div class="flex items-center gap-2">
          <select name="type" class="select select-bordered">
            <option>A</option>
            <option>AAAA</option>
            <option>MX</option>
          </select>

          <Button type="submit" class="btn-primary" loading={isSubmitting()}>
            {t('dnsQuery')}
          </Button>
        </div>
      </form>

      <Show when={DNSQueryResult().length > 0}>
        <div class="flex flex-col p-4">
          <For each={DNSQueryResult()}>
            {(item) => <div class="py-2">{item}</div>}
          </For>
        </div>
      </Show>
    </div>
  )
}

const configFormSchema = z.object({
  port: z.number(),
  'socks-port': z.number(),
  'redir-port': z.number(),
  'tproxy-port': z.number(),
  'mixed-port': z.number(),
})

const ConfigForm = () => {
  const [t] = useI18n()
  const navigate = useNavigate()

  const portList = [
    {
      label: 'HTTP Port',
      key: 'port',
      onChange: (e: Event & { target: HTMLInputElement }) =>
        void updateBackendConfigAPI('port', Number(e.target.value), refetch),
    },
    {
      label: 'Socks Port',
      key: 'socks-port',
      onChange: (e: Event & { target: HTMLInputElement }) =>
        void updateBackendConfigAPI(
          'socks-port',
          Number(e.target.value),
          refetch,
        ),
    },
    {
      label: 'Redir Port',
      key: 'redir-port',
      onChange: (e: Event & { target: HTMLInputElement }) =>
        void updateBackendConfigAPI(
          'redir-port',
          Number(e.target.value),
          refetch,
        ),
    },
    {
      label: 'TProxy Port',
      key: 'tproxy-port',
      onChange: (e: Event & { target: HTMLInputElement }) =>
        void updateBackendConfigAPI(
          'tproxy-port',
          Number(e.target.value),
          refetch,
        ),
    },
    {
      label: 'Mixed Port',
      key: 'mixed-port',
      onChange: (e: Event & { target: HTMLInputElement }) =>
        void updateBackendConfigAPI(
          'mixed-port',
          Number(e.target.value),
          refetch,
        ),
    },
  ]

  const { form, setInitialValues, reset } = createForm<
    z.infer<typeof configFormSchema>
  >({ extend: validator({ schema: configFormSchema }) })

  const [configsData, { refetch }] = createResource(fetchBackendConfigAPI)

  createEffect(() => {
    const configs = configsData()

    if (configs) {
      setInitialValues(configs)
      reset()
    }
  })

  const onSwitchEndpointClick = () => {
    setSelectedEndpoint('')
    navigate(ROUTES.Setup)
  }

  return (
    <div class="flex flex-col gap-4">
      <select
        class="select select-bordered"
        value={configsData()?.mode}
        onChange={(e) =>
          void updateBackendConfigAPI('mode', e.target.value, refetch)
        }
      >
        <option value={MODE_OPTIONS.Global}>{t('global')}</option>
        <option value={MODE_OPTIONS.Rule}>{t('rule')}</option>
        <option value={MODE_OPTIONS.Direct}>{t('direct')}</option>
      </select>

      <form class="grid grid-cols-2 gap-2" use:form={form}>
        <For each={portList}>
          {(item) => (
            <div class="form-control">
              <label class="label">
                <span class="label-text">{item.label}</span>
              </label>

              <input
                name={item.key}
                type="number"
                class="input input-bordered"
                placeholder={item.label}
                onChange={item.onChange}
              />
            </div>
          )}
        </For>
      </form>

      <div class="flex flex-wrap items-center gap-2">
        <Button loading={reloadingConfigFile()} onClick={reloadConfigFileAPI}>
          {t('reloadConfigFile')}
        </Button>

        <Button loading={flushingFakeIPData()} onClick={flushFakeIPDataAPI}>
          {t('flushFakeIPData')}
        </Button>

        <Button
          loading={updatingGEODatabases()}
          onClick={updateGEODatabasesAPI}
        >
          {t('updateGEODatabases')}
        </Button>

        <Button loading={upgradingBackend()} onClick={upgradeBackendAPI}>
          {t('upgradeCore')}
        </Button>

        <Button loading={restartingBackend()} onClick={restartBackendAPI}>
          {t('restartCore')}
        </Button>

        <Button onClick={onSwitchEndpointClick}>{t('switchEndpoint')}</Button>
      </div>
    </div>
  )
}

const ConfigForXd = () => {
  const [t, { locale }] = useI18n()

  return (
    <div class="grid grid-cols-2 place-items-center gap-4">
      <div class="col-span-2">
        <Button
          onClick={() => {
            const curLocale = locale()

            locale(curLocale === LANG.EN ? LANG.ZH : LANG.EN)
          }}
        >
          {t('switchLanguage')}
        </Button>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <ConfigTitle>{t('autoSwitchTheme')}</ConfigTitle>

          <input
            type="checkbox"
            class="toggle"
            checked={autoSwitchTheme()}
            onChange={(e) => setAutoSwitchTheme(e.target.checked)}
          />
        </div>

        <Show when={autoSwitchTheme()}>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col">
              <ConfigTitle>{t('favDayTheme')}</ConfigTitle>

              <select
                class="select select-bordered"
                onChange={(e) => setFavDayTheme(e.target.value)}
              >
                <For each={themes}>
                  {(theme) => (
                    <option selected={favDayTheme() === theme} value={theme}>
                      {theme}
                    </option>
                  )}
                </For>
              </select>
            </div>

            <div class="flex flex-col">
              <ConfigTitle>{t('favNightTheme')}</ConfigTitle>

              <select
                class="select select-bordered"
                onChange={(e) => setFavNightTheme(e.target.value)}
              >
                <For each={themes}>
                  {(theme) => (
                    <option selected={favNightTheme() === theme} value={theme}>
                      {theme}
                    </option>
                  )}
                </For>
              </select>
            </div>
          </div>
        </Show>
      </div>

      <div>
        <ConfigTitle>{t('useTwemoji')}</ConfigTitle>

        <input
          type="checkbox"
          class="toggle"
          checked={useTwemoji()}
          onChange={(e) => setUseTwemoji(e.target.checked)}
        />
      </div>
    </div>
  )
}

const Versions = () => {
  const [backendVersion, setBackendVersion] = createSignal('')

  onMount(async () => {
    const version = await fetchBackendVersionAPI()

    setBackendVersion(version)
  })

  return (
    <div class="flex items-center justify-center gap-4">
      <kbd class="kbd">{import.meta.env.version}</kbd>
      <kbd class="kbd">{backendVersion()}</kbd>
    </div>
  )
}

export default () => {
  const [t] = useI18n()

  return (
    <div class="mx-auto flex max-w-screen-md flex-col gap-4">
      <ConfigTitle withDivider>{t('dnsQuery')}</ConfigTitle>

      <DNSQueryForm />

      <ConfigTitle withDivider>{t('coreConfig')}</ConfigTitle>

      <ConfigForm />

      <ConfigTitle withDivider>{t('xdConfig')}</ConfigTitle>

      <ConfigForXd />

      <ConfigTitle withDivider>{t('version')}</ConfigTitle>

      <Versions />
    </div>
  )
}
