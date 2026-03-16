interface SectionDividerProps {
  fromColor: string
  toColor: string
  direction?: "top-to-bottom" | "bottom-to-top"
  height?: number
}

export default function SectionDivider({
  fromColor,
  toColor,
  direction = "top-to-bottom",
  height = 80,
}: SectionDividerProps) {
  const gradientDirection = direction === "top-to-bottom" ? "to bottom" : "to top"

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height: `${height}px`,
        background: `linear-gradient(${gradientDirection}, ${fromColor} 0%, ${toColor} 100%)`,
        marginTop: "-1px",
        marginBottom: "-1px",
      }}
    />
  )
}
