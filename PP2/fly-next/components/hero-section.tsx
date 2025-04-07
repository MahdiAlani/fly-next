import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative">
      <div
        className="h-[500px]"
        style={{
          backgroundImage: "url('/airplane-bg.jpg?height=500&width=1200')",
          backgroundPosition: "0% 70%",
          backgroundSize: "130%",
        }}
      >
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
        <div className="container relative h-full flex flex-col justify-center items-start text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Travel Made Simple</h1>
          <p className="text-lg md:text-xl max-w-lg mb-8">
            Search, compare, and book flights and hotels all in one place. Start your journey with FlyNext.
          </p>
        </div>
      </div>
    </section>
  )
}

