import * as A from "@matechs/core/Array";
import * as T from "@matechs/core/Effect";
import * as L from "@matechs/core/Layer";
import * as R from "@matechs/core/Ref";
import { expect, run, suite, testM } from "@matechs/test-jest";
import { testConsole, TestMessage, testMessage } from "../src/1-environment";
import { Calculator, CalculatorURI, liveCalculator, program } from "../src/2-multienv";

const logResult = testM(
  "Should log result",
  T.Do()
    .bind("ref", R.makeRef<A.Array<TestMessage>>([]))
    .doL(({ ref }) => testConsole(ref).use(program))
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

const testCalculator = (ref: R.Ref<A.Array<{ x: number; y: number }>>) =>
  L.fromEffect(
    T.access(
      (calc: Calculator): Calculator => ({
        [CalculatorURI]: {
          add: (y) => (x) =>
            T.chain_(ref.update(A.snoc({ x, y })), () => calc[CalculatorURI].add(y)(x))
        }
      })
    )
  );

const callAdd = testM(
  "Should call add",
  T.Do()
    .bind("ref", R.makeRef<A.Array<TestMessage>>([]))
    .bind("calcRef", R.makeRef<A.Array<{ x: number; y: number }>>([]))
    .doL(({ ref, calcRef }) =>
      testCalculator(calcRef).with(testConsole(ref)).erase(program)
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

run(consoleProgramSuite)(liveCalculator.use);
