
import { readableStreamToText } from "bun";
import { getConfig } from "./config";


export interface Tag {
    Key: string,
    Value: string
}

export interface EC2Instance {
    InstanceId: string,
    Tags: Tag[]
    PrivateDnsName: string,
    KeyName: string
}

export async function getEC2Instances(): Promise<EC2Instance[]> {
    const proc = Bun.spawn(["aws", "ec2", "describe-instances","--output=json"], {
        stderr: "pipe"
    });
    const errorText = await readableStreamToText(proc.stderr);
    const response = await readableStreamToText(proc.stdout);
    const responseCode = await proc.exited;
    if(responseCode != 0) {
        console.error(errorText.trim());
        process.exit(responseCode)
    };
    return JSON.parse(response).Reservations.flatMap((reservation: any) => reservation.Instances);
}

export function getInstanceName(instance: EC2Instance) {
    return instance.Tags.find((tag: any) => tag.Key == "Name")?.Value ?? instance.InstanceId;
}

export function compareEC2InstanceByRecent(a: EC2Instance, b: EC2Instance) {
    if(!getConfig().recentInstances.includes(b.InstanceId)) {
        return -1;
    }
    if(!getConfig().recentInstances.includes(a.InstanceId)) {
        return 1;
    }
    return getConfig().recentInstances.indexOf(a.InstanceId) - getConfig().recentInstances.indexOf(b.InstanceId);
}