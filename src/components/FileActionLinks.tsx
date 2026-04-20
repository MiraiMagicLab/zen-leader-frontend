import { buildCloudinaryDownloadUrl } from "@/lib/cloudinary";
import { Download, Eye } from "lucide-react";

type FileActionLinksProps = {
  url: string;
  fileName?: string;
  openLabel?: string;
  downloadLabel?: string;
  openClassName: string;
  downloadClassName: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export default function FileActionLinks({
  url,
  fileName,
  openLabel = "Open PDF",
  downloadLabel = "Download",
  openClassName,
  downloadClassName,
  onClick,
}: FileActionLinksProps) {
  const downloadUrl = buildCloudinaryDownloadUrl(url, fileName);

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={openClassName}
        onClick={onClick}
      >
        <Eye className="size-4" />
        {openLabel}
      </a>
      <a
        href={downloadUrl}
        download={fileName}
        className={downloadClassName}
        onClick={onClick}
      >
        <Download className="size-4" />
        {downloadLabel}
      </a>
    </>
  );
}
