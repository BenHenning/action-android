import * as core from '@actions/core';
import {InputOptions} from "@actions/core/lib/core";
import {SdkFactory} from "./sdk";
import execWithResult from "./exec-with-result";

async function run() {
    try {
        let api = core.getInput('api', <InputOptions>{required: false});
        if (api == null || api == "") {
            console.log(`API not set. Using 25`)
            api = '25'
        }

        let abi = core.getInput('abi', <InputOptions>{required: false});
        if (abi == null || abi == "") {
            console.log(`ABI not set. Using armeabi-v7a`)
            abi = 'armeabi-v7a'
        }

        let tag = core.getInput('tag', <InputOptions>{required: false})
        if (tag !== "default" && tag !== "google_apis") {
            console.log(`Unknown tag ${tag}. Using default`)
            tag = 'google_apis'
        }

        let acceptLicense = core.getInput('acceptLicense')
        if (acceptLicense !== "yes") {
            core.setFailed('You can\'t use this unless you accept the Android SDK licenses')
            return
        }

        console.log("Installing Android SDK")
        let sdk = new SdkFactory().getAndroidSdk();

        await sdk.install()
        await sdk.acceptLicense()

        console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`)

        const androidHome = process.env.ANDROID_HOME
        console.log(`ANDROID_HOME is ${androidHome}`)
        console.log(`PATH is ${process.env.PATH}`)

        try {
            await sdk.installEmulatorPackage(api, tag, abi)

            let supportsHardwareAcceleration = await sdk.verifyHardwareAcceleration();
            // if (!supportsHardwareAcceleration && abi == "x86") {
            //     core.setFailed('Hardware acceleration is not supported')
            //     return
            // }

            let emulator = await sdk.createEmulator("emulator", api, tag, abi);
            await sdk.listEmulators()

            await execWithResult('find $ANDROID_SDK_HOME')

            await emulator.start()
        } catch (error) {
            console.error(error)
            core.setFailed(error.message);
            return
        }
    } catch (error) {
        core.setFailed(error.message);
        return
    }
}

run();
