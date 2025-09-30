import { useState, useCallback } from 'react';
import { ChapterFormData } from '../types/admin.types';

export const useChapterManagement = (onDataRefresh: () => void) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ChapterFormData>({
    name: '',
    location: '',
    meeting_day: '',
    meeting_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = useCallback((field: keyof ChapterFormData) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/chapters/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({ name: '', location: '', meeting_day: '', meeting_time: '' });
        onDataRefresh();
      } else {
        console.error('Failed to add chapter');
      }
    } catch (error) {
      console.error('Failed to add chapter:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onDataRefresh]);

  const handleDelete = useCallback(async (chapterId: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterId}/delete/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDataRefresh();
      } else {
        console.error('Failed to delete chapter');
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  }, [onDataRefresh]);

  const handleAddChapter = useCallback(() => {
    setFormData({
      name: '',
      location: '',
      meeting_day: '',
      meeting_time: '',
    });
    setShowAddForm(true);
  }, []);

  return {
    showAddForm,
    formData,
    isSubmitting,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleAddChapter,
    setShowAddForm,
  };
};
