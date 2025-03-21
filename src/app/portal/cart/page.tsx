'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiShoppingBag, FiMinusCircle, FiPlusCircle, FiX, FiEdit, FiSave } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart, addNote } = useCart();
  const router = useRouter();
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [isEditingNotes, setIsEditingNotes] = useState<{ [key: string]: boolean }>({});

  // Initialize notes from cart items
  useEffect(() => {
    const initialNotes: { [key: string]: string } = {};
    const initialEditState: { [key: string]: boolean } = {};
    
    items.forEach(item => {
      initialNotes[item.productId] = item.notes || '';
      initialEditState[item.productId] = false;
    });
    
    setNotes(initialNotes);
    setIsEditingNotes(initialEditState);
  }, [items]);

  const handleQuantityChange = (productId: string, amount: number) => {
    const item = items.find(item => item.productId === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + amount);
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      removeItem(productId);
    }
  };

  const handleNoteChange = (productId: string, note: string) => {
    setNotes({ ...notes, [productId]: note });
  };

  const saveNote = (productId: string) => {
    addNote(productId, notes[productId] || '');
    setIsEditingNotes({ ...isEditingNotes, [productId]: false });
  };

  const toggleNoteEdit = (productId: string) => {
    setIsEditingNotes({
      ...isEditingNotes,
      [productId]: !isEditingNotes[productId]
    });
  };

  const proceedToCheckout = () => {
    router.push('/portal/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <FiShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to your cart to get started.</p>
            <Link href="/portal/products" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${item.price.toFixed(2)} / {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleQuantityChange(item.productId, -1)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <FiMinusCircle className="h-5 w-5" />
                      </button>
                      <span className="mx-2 text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.productId, 1)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <FiPlusCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {isEditingNotes[item.productId] ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={notes[item.productId] || ''}
                          onChange={(e) => handleNoteChange(item.productId, e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Add notes for this item"
                        />
                        <button
                          onClick={() => saveNote(item.productId)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900"
                        >
                          <FiSave className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 truncate max-w-xs">
                          {item.notes || 'No notes'}
                        </span>
                        <button
                          onClick={() => toggleNoteEdit(item.productId)}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <button
            onClick={() => clearCart()}
            className="text-sm text-red-600 hover:text-red-900"
          >
            Clear Cart
          </button>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>Subtotal</p>
            <p>${totalPrice.toFixed(2)}</p>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes will be calculated at checkout.</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Link
          href="/portal/products"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Continue Shopping
        </Link>
        <button
          onClick={proceedToCheckout}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={items.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
} 