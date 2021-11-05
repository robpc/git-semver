import LoggerFactory from "@robpc/logger";

LoggerFactory.setLogLevel("INFO");

const logger = LoggerFactory.get("main");

export const a = () => {
  logger.info("world");
};

logger.info("hello");
