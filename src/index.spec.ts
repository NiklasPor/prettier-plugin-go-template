import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import * as prettier from "prettier";
import * as GoTemplatePlugin from "./index";

const prettify = (code: string) =>
  prettier.format(code, {
    parser: "go-template" as any,
    plugins: [GoTemplatePlugin],
  });

const testFolder = join(__dirname, "tests");
const tests = readdirSync(testFolder);

tests
  // .filter((t) => t === "else-if")
  .forEach((test) =>
    it(test, () => {
      const path = join(testFolder, test);
      const input = readFileSync(join(path, "input.html")).toString();
      const expected = readFileSync(join(path, "expected.html")).toString();

      if (test.startsWith("invalid")) {
        jest.spyOn(console, "error").mockImplementationOnce(() => {});
      }

      const format = () => prettify(input);

      const expectedError = expected.match(/Error\("(?<message>.*)"\)/)?.groups
        ?.message;

      if (expectedError) {
        expect(format).toThrow(expectedError);
      } else {
        const result = format();
        expect(result).toEqual(expected);
        expect(prettify(result)).toEqual(expected);
      }
    })
  );
