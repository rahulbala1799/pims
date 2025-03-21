'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the cart item interface
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
  customPriced: boolean;
  notes?: string;
}

// Define the cart context interface
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
  addNote: (productId: string, note: string) => void;
}

// Create the context with a default value
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  itemCount: 0,
  totalPrice: 0,
  addNote: () => {},
});

// Create a provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize cart from localStorage if available
  const [items, setItems] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const storedCart = localStorage.getItem('portalCart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
    setInitialized(true);
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('portalCart', JSON.stringify(items));
    }
  }, [items, initialized]);

  // Add an item to the cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(i => i.productId === item.productId);

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Add new item with a generated ID
        return [...currentItems, { ...item, id: `cart-item-${Date.now()}` }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(1, quantity) } 
          : item
      )
    );
  };

  // Remove an item from the cart
  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== productId));
  };

  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
  };
  
  // Add or update note for an item
  const addNote = (productId: string, note: string) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.productId === productId 
          ? { ...item, notes: note } 
          : item
      )
    );
  };

  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Provide the context value
  const contextValue: CartContextType = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    totalPrice,
    addNote,
  };

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

// Hook for using the cart context
export const useCart = () => useContext(CartContext); 