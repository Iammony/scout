'use client';

import React, { useState } from 'react';
import { X, Globe, Tag, Eye, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface MakePublicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardId: string;
  destination: string;
  origin: string;
}

const suggestedTags = [
  'Adventure', 'Beach', 'Mountains', 'Culture', 'Food', 'Backpacking',
  'Luxury', 'Budget', 'Family', 'Solo', 'Group', 'Photography',
  'Spiritual', 'Wildlife', 'History', 'Art', 'Architecture', 'Shopping'
];

export default function MakePublicModal({
  isOpen,
  onClose,
  onSuccess,
  cardId,
  destination,
  origin
}: MakePublicModalProps) {
  const [title, setTitle] = useState(`${origin} to ${destination} Travel Guide`);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 5) // Max 5 tags
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 5) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/cards/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          title: title.trim(),
          description: description.trim(),
          tags: selectedTags
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to make card public');
      }
    } catch (error) {
      setError('Failed to make card public. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-neon">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 flex items-center justify-center shadow-neon">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
                Share Your Travel Guide
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Make your travel card public for the community to discover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium text-gray-900 dark:text-white">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your travel guide a catchy title"
              className="border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
              disabled={isSubmitting}
              maxLength={100}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {title.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium text-gray-900 dark:text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share what makes your travel guide special..."
              className="border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 min-h-[100px]"
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {description.length}/500 characters
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-900 dark:text-white">
              Tags ({selectedTags.length}/5)
            </Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-web3-violet-100 dark:bg-web3-violet-900/30 text-web3-violet-700 dark:text-web3-violet-400 rounded-lg text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={selectedTags.includes(tag) || selectedTags.length >= 5}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all duration-300 ${
                      selectedTags.includes(tag)
                        ? 'bg-web3-violet-600 text-white border-web3-violet-600'
                        : selectedTags.length >= 5
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-web3-violet-300 dark:border-web3-violet-700 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            {selectedTags.length < 5 && (
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag"
                  className="flex-1 border-web3-violet-300 dark:border-web3-violet-700 rounded-xl focus:ring-web3-violet-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                  maxLength={20}
                />
                <Button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim() || selectedTags.includes(customTag.trim())}
                  variant="outline"
                  className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Benefits Info */}
          <div className="p-4 glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-web3-violet-600 dark:text-web3-violet-400" />
              <span>Why share your travel guide?</span>
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Heart className="w-3 h-3 text-red-400" />
                <span>Help fellow travelers discover amazing destinations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-3 h-3 text-blue-400" />
                <span>Get recognition for your travel planning skills</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-3 h-3 text-green-400" />
                <span>Connect with like-minded travelers</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white shadow-web3 hover:shadow-neon transition-all duration-300 border-0"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Publishing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Make Public</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}