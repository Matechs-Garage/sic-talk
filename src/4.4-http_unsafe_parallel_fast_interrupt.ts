import * as T from "@matechs/core/Effect";
import * as Ex from "@matechs/core/Exit";
import { constVoid, pipe } from "@matechs/core/Function";
import { log } from "./1-environment";
import { HttpError, JsonError } from "./3-async";
import { appLayer, getTodo, showTodos, TodoDeserializationError } from "./4-http";

// demonstrate interruption of all at first error

const main = pipe(
  T.parFastSequenceT(
    pipe(getTodo(1), T.onInterrupted(T.sync(() => console.log("interrupted")))),
    getTodo(2),
    getTodo(3),
    T.raiseError("trigger")
  ),
  T.chain((todos) => log(showTodos.show(todos)))
);

const liveMain: T.AsyncE<
  HttpError | JsonError | TodoDeserializationError | string,
  void
> = pipe(main, appLayer.use);

T.run(liveMain, Ex.foldExit(console.error, constVoid));
