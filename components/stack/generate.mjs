import { isMain, runComponent } from '../../scripts/lib/config.mjs';
import { renderStack } from '../../scripts/lib/logo-groups.mjs';

export async function render(ctx) {
  const { config, common, root } = ctx;
  return {
    assets: [{ path: config.output, svg: await renderStack(config.groups, root, config.title, common, config.layout, { iconStyle: config.iconStyle }) }],
  };
}

if (isMain(import.meta.url)) await runComponent('stack', render);
