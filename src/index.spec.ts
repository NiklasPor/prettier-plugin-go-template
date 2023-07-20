import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import * as GoTemplatePlugin from "./index";

const prettify = (
  code: string,
  options: Partial<GoTemplatePlugin.PrettierPluginGoTemplateParserOptions>,
) =>
  prettier.format(code, {
    parser: "go-template" as any,
    plugins: [GoTemplatePlugin],
    ...options,
  });

const testFolder = join(__dirname, "tests");
const tests = readdirSync(testFolder);

describe("format", () => {
  tests.forEach((test) =>
    it(test, async () => {
      const path = join(testFolder, test);
      const input = readFileSync(join(path, "input.html")).toString();
      const expected = readFileSync(join(path, "expected.html")).toString();

      const configPath = join(path, "config.json");
      const configString =
        existsSync(configPath) && readFileSync(configPath)?.toString();
      const configObject = configString ? JSON.parse(configString) : {};

      const expectedError = expected.match(/Error\("(?<message>.*)"\)/)?.groups
        ?.message;

      const format = () => prettify(input, configObject);

      if (expectedError) {
        jest.spyOn(console, "error").mockImplementation(() => {});
        await expect(format()).rejects.toEqual(new Error(expectedError));
      } else {
        const result = prettify(input, configObject);
        await expect(await result).toEqual(expected);
        // Check that a second prettifying is not changing the result again.
        await expect(await prettify(await result, configObject)).toEqual(
          expected,
        );
      }
    }),
  );
});
