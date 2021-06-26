import { ulid } from "ulid";

export function createIdGenerator(): () => string {
  return () => ulid();
}
