import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ImagePair } from "./ImagePair";
import { MdxImage } from "./MdxImage";

export const mdxComponents = {
  img: MdxImage,
  ImagePair,
};

export function compilePostMdx(source: string) {
  return compileMDX({
    source,
    components: mdxComponents,
    options: {
      // This content is trusted and version-controlled. Object expressions are
      // required by the controlled ImagePair API; dangerous calls stay blocked.
      blockJS: false,
      blockDangerousJS: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });
}
