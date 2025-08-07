"use client";
import PostAnnouncementComponent from "@/components/post-announcement-component";
import { useSearchParams } from "next/navigation";

const PostAnnouncement = () => {
  const searchParams = useSearchParams();
  const announcementId = searchParams.get('announcementId');
  return(
    <>
      <PostAnnouncementComponent announceId = { announcementId ? +announcementId : 0} />
    </>
  );
}

export default PostAnnouncement;