import { IEnvModel } from '.';
import { EmptyFun } from '../util';

export class RenderStore<T> {
  private dirtyEnv!: IEnvModel;
  private dirtyValue!: T;
  constructor(
    private value: T,
    trans?: (v: T) => T
  ) {
    if (trans) {
      this.commit = () => {
        this.value = trans(this.dirtyValue);
      };
    } else {
      this.commit = () => {
        this.value = this.dirtyValue;
      };
    }
  }
  get(env: IEnvModel): T {
    if (env == this.dirtyEnv) {
      return this.dirtyValue;
    }
    return this.value;
  }
  set(env: IEnvModel, value: T) {
    this.dirtyEnv = env;
    this.dirtyValue = value;
    env.commitChange(this.commit);
  }
  private commit: EmptyFun;
}
