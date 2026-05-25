type Fields = Record<string, unknown>;

function fmt(level: string, msg: string, fields?: Fields) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(fields ?? {}),
  };
  return JSON.stringify(payload);
}

export const logger = {
  info(msg: string, fields?: Fields) {
    console.log(fmt("info", msg, fields));
  },
  warn(msg: string, fields?: Fields) {
    console.warn(fmt("warn", msg, fields));
  },
  error(msg: string, fields?: Fields) {
    console.error(fmt("error", msg, fields));
  },
  debug(msg: string, fields?: Fields) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(fmt("debug", msg, fields));
    }
  },
};
