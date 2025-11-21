import { useState } from "react";

export const = {
    const [cartCount, setCartCount] = useState(0);
    const addToCart = () => {
        setCartCount(prev => prev + 1);
      };
}