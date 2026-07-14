const timestampHasTimeZone = (timestampText) => /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(timestampText);
const utcWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const utcMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const padTimePart = (value) => String(value).padStart(2, "0");

const parseChatTimestamp = (timestamp) => {
    if(!timestamp){
        return null;
    }
    if(timestamp instanceof Date){
        return Number.isNaN(timestamp.getTime()) ? null : timestamp;
    }
    if(typeof timestamp === "number"){
        const parsedNumber = new Date(timestamp);
        return Number.isNaN(parsedNumber.getTime()) ? null : parsedNumber;
    }
    const timestampText = String(timestamp).trim();
    if(timestampText === ""){
        return null;
    }
    const normalizedTimestamp = timestampHasTimeZone(timestampText) ? timestampText : `${timestampText}Z`;
    const parsedTimestamp = new Date(normalizedTimestamp);
    return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
};

const formatUTCTimestamp = (date) => `${utcWeekdays[date.getUTCDay()]} ${utcMonths[date.getUTCMonth()]} ${padTimePart(date.getUTCDate())} ${date.getUTCFullYear()} ${padTimePart(date.getUTCHours())}:${padTimePart(date.getUTCMinutes())}:${padTimePart(date.getUTCSeconds())} UTC`;

export const formatChatTimestamp = (timestamp, viewUTCTime) => {
    const parsedTimestamp = parseChatTimestamp(timestamp);
    if(!parsedTimestamp){
        return "";
    }
    if(viewUTCTime){
        return formatUTCTimestamp(parsedTimestamp);
    }
    return `${parsedTimestamp.toDateString()} ${parsedTimestamp.toLocaleString(["en-us"], {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
    })}`;
};

export const jsonTextForChatConfigValue = (value) => {
    if(value === undefined || value === null){
        return "";
    }
    if(typeof value === "string"){
        const trimmed = value.trim();
        if(trimmed === ""){
            return "";
        }
        try{
            return JSON.stringify(JSON.parse(trimmed), null, 2);
        }catch(error){
            return value;
        }
    }
    try{
        return JSON.stringify(value, null, 2);
    }catch(error){
        return `${value}`;
    }
};
