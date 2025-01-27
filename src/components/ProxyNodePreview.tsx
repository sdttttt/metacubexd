import { Show, createMemo } from 'solid-js'
import { ProxyPreviewBar, ProxyPreviewDots } from '~/components'
import { PROXIES_PREVIEW_TYPE } from '~/constants'
import { proxiesPreviewType } from '~/signals'

export const ProxyNodePreview = (props: {
  proxyNameList: string[]
  now?: string
}) => {
  const off = () => proxiesPreviewType() === PROXIES_PREVIEW_TYPE.OFF

  const isSmallGroup = createMemo(() => props.proxyNameList.length <= 30)

  const isShowBar = createMemo(() => {
    const type = proxiesPreviewType()

    return (
      type === PROXIES_PREVIEW_TYPE.BAR ||
      (type === PROXIES_PREVIEW_TYPE.Auto && !isSmallGroup())
    )
  })

  const isShowDots = createMemo(() => {
    const type = proxiesPreviewType()

    return (
      type === PROXIES_PREVIEW_TYPE.DOTS ||
      (type === PROXIES_PREVIEW_TYPE.Auto && isSmallGroup())
    )
  })

  return (
    <Show when={!off()}>
      <Show when={isShowBar()}>
        <ProxyPreviewBar proxyNameList={props.proxyNameList} now={props.now} />
      </Show>
      <Show when={isShowDots()}>
        <ProxyPreviewDots proxyNameList={props.proxyNameList} now={props.now} />
      </Show>
    </Show>
  )
}
