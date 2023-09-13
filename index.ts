#!/usr/bin/env bun

import { readableStreamToText } from "bun";
import fs from "fs/promises";
import chalk from "chalk";
import prompts from "prompts";
import { EC2Instance, compareEC2InstanceByRecent, getEC2Instances, getInstanceName } from "./aws";
import { CONFIG_FILE, getConfig, saveConfig } from "./config";


const keyLocations = [
    ".",
    `${Bun.env.HOME}/Keys`,
    `${Bun.env.HOME}/Downloads`
];



async function findKey(keyName: string) {
    for(let location of keyLocations) {
        const keyLocation = `${location}/${keyName}.pem`
        if(await Bun.file(keyLocation).exists())
            return keyLocation;
    }
    return null;
}

const instances = await getEC2Instances();

instances.sort(compareEC2InstanceByRecent);


const response = await prompts({
    type: 'select',
    name: 'instance',
    message: "Select an instance.",
    choices: instances.map((instance : EC2Instance) => ({title: getInstanceName(instance), value: instance}))
});

const instance: EC2Instance = response.instance;

const keyPath = await findKey(response.instance.KeyName);

if(keyPath === null) {
    console.error("Could not find key.");
    console.error("  Checked Paths:");
    keyLocations.forEach(location => console.error(`    - ${location}/${instance.KeyName}.pem`));
    process.exit(1);
}

let username = getConfig().instanceUsernames[instance.InstanceId] ?? await prompts({
    type: 'text',
    name: 'username',
    message: 'Username'
}).then(x => x.username);

getConfig().instanceUsernames[instance.InstanceId] = username;
getConfig().recentInstances = [
    instance.InstanceId,
    ...getConfig().recentInstances.filter(x => x != instance.InstanceId)
];
await saveConfig();
console.log("Starting ssh");
const proc = Bun.spawn(["ssh", "-i", keyPath, `${username}@${instance.PrivateDnsName}`],{
    stdout: "inherit",
    stdin: "inherit",
});
await proc.exited;