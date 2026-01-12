import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from '@/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "gradient-primary text-white hover:opacity-90 shadow-colored active:translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[1.5rem] border bg-card text-card-foreground shadow-custom-md transition-all duration-300 hover:shadow-custom-lg",
      className
    )}
    {...props} />
))
Card.displayName = "Card"

export { Button, buttonVariants, Card }
