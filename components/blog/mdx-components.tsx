import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { enforceTrustedMdxPolicy } from "../../lib/content/mdx-policy";
import { ArticleLoop } from "./ArticleLoop";
import { ArticleVideo } from "./ArticleVideo";
import { ImagePair } from "./ImagePair";
import { ArticleImage } from "./MdxImage";

export const mdxComponents = {
  ArticleImage,
  ArticleLoop,
  ArticleVideo,
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
        remarkPlugins: [remarkGfm, enforceTrustedMdxPolicy],
      },
    },
  });
}
