import React from "react";
import {gql, useQuery, useSubscription} from "@apollo/client";

const getOperationNow = (serverSkew) => new Date(Date.now() + serverSkew);

export const CHAT_DIRECTORY_FIELDS = gql`
fragment ChatDirectoryFields on chat_channel {
    id
    name
    slug
    description
    channel_type
    archived
    locked
    locked_by
    last_message_id
    chat_container_id
    chat_model
    updated_at
    chat_container {
      id
      name
      container_running
      deleted
    }
    locked_operator {
      username
    }
}
`;

const CHAT_DIRECTORY_QUERY = gql`
${CHAT_DIRECTORY_FIELDS}
query ChatDirectory {
  chat_channel(order_by: [{archived: asc}, {channel_type: asc}, {name: asc}]) {
    ...ChatDirectoryFields
  }
}
`;

const CHAT_DIRECTORY_STREAM_SUBSCRIPTION = gql`
${CHAT_DIRECTORY_FIELDS}
subscription ChatDirectoryStream($now: timestamp!) {
  chat_channel_stream(batch_size: 50, cursor: {initial_value: {updated_at: $now}, ordering: ASC}) {
    ...ChatDirectoryFields
  }
}
`;

const CHAT_READ_STATE_QUERY = gql`
query ChatDirectoryReadState {
  chat_read_state {
    channel_id
    last_read_message_id
    muted
    updated_at
  }
}
`;

const CHAT_READ_STATE_STREAM_SUBSCRIPTION = gql`
subscription ChatDirectoryReadStateStream($now: timestamp!) {
  chat_read_state_stream(batch_size: 50, cursor: {initial_value: {updated_at: $now}, ordering: ASC}) {
    channel_id
    last_read_message_id
    muted
    updated_at
  }
}
`;

export const sortChatChannels = (a, b) => {
    if(a.archived !== b.archived){ return a.archived ? 1 : -1; }
    if(a.channel_type !== b.channel_type){ return a.channel_type.localeCompare(b.channel_type); }
    return (a.name || "").localeCompare(b.name || "");
};

const timestampValue = (timestamp) => {
    if(!timestamp){ return 0; }
    const value = new Date(timestamp).getTime();
    return Number.isNaN(value) ? 0 : value;
};

export const mergeChatDirectoryRows = (current, incoming) => {
    if(!incoming || incoming.length === 0){ return current; }
    const rowsByID = new Map((current || []).map((channel) => [channel.id, channel]));
    incoming.forEach((channel) => {
        const existing = rowsByID.get(channel.id);
        if(!existing || timestampValue(channel.updated_at) >= timestampValue(existing.updated_at)){
            rowsByID.set(channel.id, {...existing, ...channel});
        }
    });
    return [...rowsByID.values()].sort(sortChatChannels);
};

export const getChatReadState = (readState, channelID) => (
    readState[channelID] || {lastReadMessageID: 0, muted: false, updatedAt: null}
);

export const mergeChatReadStateRows = (current, incoming) => {
    if(!incoming || incoming.length === 0){ return current; }
    return incoming.reduce((next, row) => {
        const existing = getChatReadState(next, row.channel_id);
        if(existing.updatedAt && row.updated_at && timestampValue(row.updated_at) < timestampValue(existing.updatedAt)){
            return next;
        }
        return {
            ...next,
            [row.channel_id]: {
                lastReadMessageID: Math.max(existing.lastReadMessageID || 0, row.last_read_message_id || 0),
                muted: row.muted === undefined ? existing.muted : Boolean(row.muted),
                updatedAt: row.updated_at || existing.updatedAt,
            },
        };
    }, current);
};

const ChatDirectoryContext = React.createContext(null);

export function ChatDirectoryProvider({me, children}) {
    const operationID = me?.user?.current_operation_id || 0;
    const serverSkew = me?.user?.server_skew || 0;
    const enabled = Boolean(me?.loggedIn && operationID);
    const streamStart = React.useRef(getOperationNow(serverSkew).toISOString());
    const [channels, setChannels] = React.useState([]);
    const [readState, setReadState] = React.useState({});

    React.useEffect(() => {
        streamStart.current = getOperationNow(serverSkew).toISOString();
        setChannels([]);
        setReadState({});
    }, [operationID, enabled, serverSkew]);

    const {data: channelData, error: channelQueryError} = useQuery(CHAT_DIRECTORY_QUERY, {
        skip: !enabled,
        fetchPolicy: "no-cache",
    });
    const {data: readStateData, error: readStateQueryError} = useQuery(CHAT_READ_STATE_QUERY, {
        skip: !enabled,
        fetchPolicy: "no-cache",
    });

    React.useEffect(() => {
        if(channelData?.chat_channel){
            setChannels((current) => mergeChatDirectoryRows(current, channelData.chat_channel));
        }
    }, [channelData]);
    React.useEffect(() => {
        if(readStateData?.chat_read_state){
            setReadState((current) => mergeChatReadStateRows(current, readStateData.chat_read_state));
        }
    }, [readStateData]);

    const {error: channelStreamError} = useSubscription(CHAT_DIRECTORY_STREAM_SUBSCRIPTION, {
        variables: {now: streamStart.current},
        skip: !enabled,
        fetchPolicy: "no-cache",
        onData: ({data}) => {
            const updates = data.data?.chat_channel_stream || [];
            if(updates.length > 0){
                setChannels((current) => mergeChatDirectoryRows(current, updates));
            }
        },
    });
    const {error: readStateStreamError} = useSubscription(CHAT_READ_STATE_STREAM_SUBSCRIPTION, {
        variables: {now: streamStart.current},
        skip: !enabled,
        fetchPolicy: "no-cache",
        onData: ({data}) => {
            const updates = data.data?.chat_read_state_stream || [];
            if(updates.length > 0){
                setReadState((current) => mergeChatReadStateRows(current, updates));
            }
        },
    });

    const updateReadState = React.useCallback((channelID, update) => {
        if(!channelID){ return; }
        setReadState((current) => {
            const existing = getChatReadState(current, channelID);
            const next = typeof update === "function" ? update(existing) : update;
            return {
                ...current,
                [channelID]: {...existing, ...next},
            };
        });
    }, []);

    const unreadCount = React.useMemo(() => channels.reduce((count, channel) => {
        if(channel.archived){ return count; }
        const latestMessageID = channel.last_message_id || 0;
        return latestMessageID > getChatReadState(readState, channel.id).lastReadMessageID ? count + 1 : count;
    }, 0), [channels, readState]);

    const value = React.useMemo(() => ({
        channels,
        readState,
        unreadCount,
        updateReadState,
        error: channelQueryError || readStateQueryError || channelStreamError || readStateStreamError || null,
    }), [channels, readState, unreadCount, updateReadState, channelQueryError, readStateQueryError, channelStreamError, readStateStreamError]);

    return (
        <ChatDirectoryContext.Provider value={value}>
            {children}
        </ChatDirectoryContext.Provider>
    );
}

export const useChatDirectory = () => {
    const value = React.useContext(ChatDirectoryContext);
    if(!value){
        throw new Error("useChatDirectory must be used inside ChatDirectoryProvider");
    }
    return value;
};
