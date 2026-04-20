import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { cn } from "@/lib/utils"

type PageLoadingProps = {
  className?: string
}

export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div className={cn("flex min-h-[80vh] h-full w-full items-center justify-center bg-background", className)}>
      <DotLottieReact
        src="https://lottie.host/445490c0-adf1-42dd-a6f7-34de161fbbcb/UPQtzly8nf.lottie"
        loop
        autoplay
        className="h-48 w-48"
      />
    </div>
  )
}
