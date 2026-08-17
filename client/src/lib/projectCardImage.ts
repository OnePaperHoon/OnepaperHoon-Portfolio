export type ProjectCardMedia = {
  thumbnailUrl?: string;
  image?: string;
};

export function getProjectCardImage({ thumbnailUrl, image }: ProjectCardMedia) {
  return thumbnailUrl?.trim() || image;
}

export function hasProjectCardImage(media: ProjectCardMedia) {
  return Boolean(getProjectCardImage(media));
}
