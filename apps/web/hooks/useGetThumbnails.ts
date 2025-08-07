const useGetThumbnails = async (url: string) => {

  const embeddedUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|live\/|watch\?v=|v\/|watch\?.+&v=|shorts)\/([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|vimeo\.com\/(?:channels\/[A-Za-z0-9]+\/)?(?:videos?\/)?(\d+)(?:\/([a-zA-Z0-9]+))?)/;

  let thumbnailUrl: string = '';
  let convertedEmbeddedUrl: string = '';
  let canBeEmbedded: boolean = true;
  const isValidEmbeddedUrl = embeddedUrlRegex.test(url);
  if (isValidEmbeddedUrl) {
    const matches = url.match(embeddedUrlRegex);
    if (matches && (matches[1] || matches[2]) || (matches && matches[3])) {
      let videoId = matches[1] || matches[2];
      if (matches[3]) {
        videoId = matches[1] || matches[2] || matches[3];
        try {
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
          const videoData = await response.json();
          thumbnailUrl = videoData[0].thumbnail_medium;
          if(videoData[0] && videoData[0].embed_privacy){
            canBeEmbedded = (videoData[0].embed_privacy == "nowhere") ? false : true;
          }
          convertedEmbeddedUrl = `https://player.vimeo.com/video/${videoId}`;
        } catch (error) {
          if(matches[4]){
            convertedEmbeddedUrl = `https://player.vimeo.com/video/${videoId}?h=${matches[4]}`;
          }
          return { thumbnailUrl: `https://vimeo.com/api/v2/video/${videoId}.json`, convertedEmbeddedUrl , canBeEmbedded: false};
        }

      } else if (matches[1] || matches[2]) {
        const youtubeThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hq720.jpg`;
        thumbnailUrl = youtubeThumbnailUrl;
        convertedEmbeddedUrl = `https://www.youtube.com/embed/${videoId}`
      }
      return { thumbnailUrl, convertedEmbeddedUrl, canBeEmbedded };
    }
  } else {
    return undefined;
  }
}

export default useGetThumbnails;
