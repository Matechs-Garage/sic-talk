import { suite, testM, expect, run, mockedTestM, spyOn } from "@matechs/test-jest";
import { program, liveCalculator, Calculator, CalculatorURI } from "../src/2-multienv";
import * as T from "@matechs/core/Effect";
import * as A from "@matechs/core/Array";
import * as R from "@matechs/core/Ref";
import { pipe } from "@matechs/core/Pipe";
import { TestMessage, testConsole, testMessage } from "../src/1-environment";

const logResult = testM(
  "Should log result",
  T.Do()
    .bind("ref", R.makeRef<Array<TestMessage>>([]))
    .doL(({ ref }) => pipe(program, testConsole(ref)))
    .bindL("messages", ({ ref }) => ref.get)
    .doL(({ messages }) =>
      T.sync(() => {
        expect(messages).toHaveLength(1);
        expect(messages).toStrictEqual([
          testMessage({
            level: "log",
            message: `result: 15`,
            rest: []
          })
        ]);
      })
    )
    .unit()
);

const callAdd = testM(
  "Should call add",
  T.Do()
    .bind("ref", R.makeRef<Array<TestMessage>>([]))
    .bind("calcRef", R.makeRef<Array<{ x: number; y: number }>>([]))
    .doL(({ ref, calcRef }) =>
      pipe(
        program,
        testConsole(ref),
        T.provideM(
          T.access(
            ({ [CalculatorURI]: { add } }: Calculator): Calculator => ({
              [CalculatorURI]: {
                add: (y) => (x) =>
                  T.chain_(calcRef.update(A.snoc({ x, y })), () => add(y)(x))
              }
            })
          )
        )
      )
    )
    .bindL("calls", ({ calcRef }) => calcRef.get)
    .doL(({ calls }) =>
      T.sync(() => {
        expect(calls).toHaveLength(1);
        expect(calls).toStrictEqual([{ y: 10, x: 5 }]);
      })
    )
    .unit()
);

const consoleProgramSuite = suite("MultiEnv Suite")(logResult, callAdd);

run(consoleProgramSuite)(liveCalculator);