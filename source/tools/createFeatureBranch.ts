import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';

export async function createFeatureBranch(args: CreateFeatureBranchArgs): Promise<CreateFeatureBranchResult> {
	const {feature_description, json_mode = false} = args;

	try {
		// Get repository root
		const repoRoot = execSync('git rev-parse --show-toplevel', {encoding: 'utf8'}).trim();
		const specsDir = path.join(repoRoot, 'specs');

		// Create specs directory if it doesn't exist
		if (!fs.existsSync(specsDir)) {
			fs.mkdirSync(specsDir, {recursive: true});
		}

		// Find the highest numbered feature directory
		let highest = 0;
		if (fs.existsSync(specsDir)) {
			const dirs = fs.readdirSync(specsDir, {withFileTypes: true})
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name);

			for (const dirname of dirs) {
				const numberMatch = dirname.match(/^(\d+)/);
				if (numberMatch && numberMatch[1]) {
					const number = parseInt(numberMatch[1], 10);
					if (number > highest) {
						highest = number;
					}
				}
			}
		}

		// Generate next feature number with zero padding
		const next = highest + 1;
		const featureNum = next.toString().padStart(3, '0');

		// Create branch name from description
		const branchName = feature_description
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-/, '')
			.replace(/-$/, '');

		// Final branch name
		const finalBranchName = `${featureNum}-${branchName}`;

		// Create and switch to new branch
		execSync(`git checkout -b "${finalBranchName}"`, {stdio: 'inherit'});

		// Create feature directory
		const featureDir = path.join(specsDir, finalBranchName);
		fs.mkdirSync(featureDir, {recursive: true});

		// Prepare output
		let output: string;

		if (json_mode) {
			const result = {
				BRANCH_NAME: finalBranchName,
				FEATURE_NUM: featureNum,
				SPEC_DIR: featureDir
			};
			output = JSON.stringify(result, null, 2);
		} else {
			// Legacy key: value format for LLM compatibility
			output = [
				`$BRANCH_NAME: ${finalBranchName}`,
				`$FEATURE_NUM: ${featureNum}`,
				`$SPEC_DIR: ${featureDir}`
			].join('\n');
		}

		return {
			success: true,
			output
		};

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			success: false,
			output: '',
			error: `Error creating feature branch: ${errorMessage}`
		};
	}
}