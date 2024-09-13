/// <reference path="./.sst/platform/config.d.ts" />

import path from "node:path";
import crypto from "node:crypto";

export default $config({
  app(input) {
    return {
      name: "sst-gh-actions-debug",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: { region: "us-east-1" },
        command: true,
      }
    };
  },
  async run() {
		const cloudBuild = new command.local.Command("cloudBuild", {
			create:
				"./.github/cl.sh build --arm64 --release",
			dir: process.cwd(),
			// TODO: We should be able to ask Nx if the project has changed and only deploy if required.
			triggers: [crypto.randomUUID()],
			environment: {
				CARGO_TERM_COLOR: "always",
			},
		});

		// TODO: Remove this
		new command.local.Command(
			"todo",
			{
				create: `echo 'ITS IS DONE' && ls target/lambda && ls target/lambda/lambda && echo '${process.cwd()}'`,
				triggers: [crypto.randomUUID()],
				dir: process.cwd(),
			},
			{
				dependsOn: [cloudBuild],
			},
		);

  	new sst.aws.Function(
			"cloud",
			{
	
				handler: "bootstrap",
				architecture: "arm64",
				runtime: "provided.al2023",
				bundle: cloudBuild.stdout.apply(() => path.join(process.cwd(), "target", "lambda", "lambda")),
				memory: "128 MB",
			},
			{
				// TODO: I think this is not working
				dependsOn: [cloudBuild],
			},
		);
  },
});
