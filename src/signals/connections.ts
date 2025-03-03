import { differenceWith, isNumber, unionWith } from 'lodash'
import { Accessor, createEffect, createSignal, untrack } from 'solid-js'
import { CONNECTIONS_TABLE_MAX_CLOSED_ROWS } from '~/constants'
import { Connection, ConnectionRawMessage } from '~/types'

export type WsMsg = {
  connections?: ConnectionRawMessage[]
  uploadTotal: number
  downloadTotal: number
} | null

// we make connections global, so we can keep track of connections when user in proxy page
// when user selects proxy and close some connections they can back and check connections
// they closed
export const [allConnections, setAllConnections] = createSignal<Connection[]>(
  [],
)

export let latestConnectionMsg: Accessor<WsMsg> = () => ({
  uploadTotal: 0,
  downloadTotal: 0,
  connections: [],
})

export const setLatestConnectionMsg = (accessor: Accessor<WsMsg>) => {
  latestConnectionMsg = accessor
}

export const useConnections = () => {
  const [closedConnections, setClosedConnections] = createSignal<Connection[]>(
    [],
  )
  const [activeConnections, setActiveConnections] = createSignal<Connection[]>(
    [],
  )
  const [paused, setPaused] = createSignal(false)

  createEffect(() => {
    const rawConns = latestConnectionMsg()?.connections

    if (!rawConns) {
      return
    }

    untrack(() => {
      const activeConns = restructRawMsgToConnection(
        rawConns,
        activeConnections(),
      )

      mergeAllConnections(activeConnections())

      if (!paused()) {
        const closedConns = diffClosedConnections(activeConns, allConnections())

        setActiveConnections(activeConns)
        setClosedConnections(
          closedConns.slice(-CONNECTIONS_TABLE_MAX_CLOSED_ROWS),
        )
      }

      setAllConnections((allConnections) =>
        allConnections.slice(
          -(activeConns.length + CONNECTIONS_TABLE_MAX_CLOSED_ROWS),
        ),
      )
    })
  })

  return {
    closedConnections,
    activeConnections,
    paused,
    setPaused,
  }
}

export const restructRawMsgToConnection = (
  connections: ConnectionRawMessage[],
  prevActiveConnections: Connection[],
): Connection[] => {
  const prevMap = new Map<string, Connection>()
  prevActiveConnections.forEach((prev) => prevMap.set(prev.id, prev))

  return connections.map((connection) => {
    const prevConn = prevMap.get(connection.id)

    if (
      !prevConn ||
      !isNumber(prevConn.download) ||
      !isNumber(prevConn.upload)
    ) {
      return { ...connection, downloadSpeed: 0, uploadSpeed: 0 }
    }

    return {
      ...connection,
      downloadSpeed: connection.download - prevConn.download,
      uploadSpeed: connection.upload - prevConn.upload,
    }
  })
}

export const mergeAllConnections = (activeConns: Connection[]) => {
  setAllConnections((allConnections) =>
    unionWith(allConnections, activeConns, (a, b) => a.id === b.id),
  )
}

const diffClosedConnections = (
  activeConns: Connection[],
  allConns: Connection[],
) => differenceWith(allConns, activeConns, (a, b) => a.id === b.id)
