import fs from "fs/promises";

export interface Config {
  instanceUsernames: Record<string, string>;
  recentInstances: string[];
}

const CONFIG_DIR = `${Bun.env.HOME}/.ec2-ssh`;
const CONFIG_PATH = `${CONFIG_DIR}/config.json`;
export const CONFIG_FILE = Bun.file(CONFIG_PATH, { type: "application/json" });

let config: Config = {
  instanceUsernames: {},
  recentInstances: [],
};

if (!(await Bun.file(CONFIG_DIR).exists())) {
  try {
    await fs.mkdir(CONFIG_DIR);
  } catch (e) {}
}

if (await CONFIG_FILE.exists()) {
  config = await CONFIG_FILE.json();
}

export function getConfig(): Config {
  return config;
}

export function saveConfig() {
  return Bun.write(CONFIG_FILE, JSON.stringify(getConfig(), null, 2));
}
