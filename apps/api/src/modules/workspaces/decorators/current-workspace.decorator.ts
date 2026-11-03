import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentWorkspace = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.workspace;
    return data && workspace ? workspace[data] : workspace;
  },
);
