// components/ui/separator.tsx

import React from "react";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={`border-t border-muted my-4 ${className ?? ""}`}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };
