import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { useGroups } from '../contexts/GroupsContext';
import { toast } from 'react-toastify';
import {institutions } from '../utils/types';
import './CreateGroupForm.css';
import Select from 'react-select';

const CreateGroupForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { createGroup } = useGroups();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institution: '',
    course_code: '',
    is_private: false
  });

  // Validation state
  const [validation, setValidation] = useState({
    name: { valid: true, message: '' },
    description: { valid: true, message: '' },
    institution: { valid: true, message: '' },
    course_code: { valid: true, message: '' }
  });

  const institutionOptions = institutions.map(inst => ({ value: inst, label: inst }));
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (validation[name] && !validation[name].valid) {
      setValidation({
        ...validation,
        [name]: { valid: true, message: '' }
      });
    }
  };

  const validateForm = () => {
    const newValidation = { ...validation };
    let isValid = true;

    if (!formData.name.trim()) {
      newValidation.name = { valid: false, message: 'Group name is required.' };
      isValid = false;
    }

    if (!formData.description.trim()) {
      newValidation.description = { valid: false, message: 'Description is required.' };
      isValid = false;
    }

    if (!formData.institution) {
      newValidation.institution = { valid: false, message: 'Institution is required.' };
      isValid = false;
    }

    if (!formData.course_code.trim()) {
      newValidation.course_code = { valid: false, message: 'Course code is required.' };
      isValid = false;
    }

    setValidation(newValidation);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const newGroup = await createGroup({
        name: formData.name,
        description: formData.description,
        institution: formData.institution,
        courseCode: formData.course_code,
        isPrivate: formData.is_private,
      });
      toast.success('Group created successfully!');
      navigate(`/groups/${newGroup._id}/dashboard`);
    } catch (err) {
      setError('An error occurred while creating the group. Please try again.');
      toast.error('Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Create a New Group</h1>

      {error && (
        <div className="error">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="formGroup">
          <label htmlFor="name" className="label">Group Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input ${!validation.name.valid ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="e.g., Introduction to Computer Science - Fall"
          />
          {!validation.name.valid && <p className="validationError">{validation.name.message}</p>}
        </div>

        <div className="formGroup">
          <label htmlFor="description" className="label">Description*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={`textarea ${!validation.description.valid ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="Describe the group, goals, and what participants will find..."
          ></textarea>
          {!validation.description.valid && <p className="validationError">{validation.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="formGroup">
            <label htmlFor="institution" className="label">Institution*</label>
            <Select
              id="institution"
              name="institution"
              value={formData.institution ? { value: formData.institution, label: formData.institution } : null}
              onChange={(selectedOption) => handleChange({ target: { name: 'institution', value: selectedOption ? selectedOption.value : '' } })}
              options={institutionOptions}
              isSearchable
              placeholder="Search for an institution"
              className="select-container"
              classNamePrefix="react-select"
            />
            {!validation.institution.valid && <p className="validationError">{validation.institution.message}</p>}
          </div>

          <div className="formGroup">
            <label htmlFor="course_code" className="label">Course Code*</label>
            <input
              type="text"
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              className={`input ${!validation.course_code.valid ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="e.g., CS101"
            />
            {!validation.course_code.valid && <p className="validationError">{validation.course_code.message}</p>}
          </div>
        </div>

        <div className="privateGroup">
          <div className="privateGroupLabel">
            <input
              type="checkbox"
              id="is_private"
              name="is_private"
              checked={formData.is_private}
              onChange={handleChange}
            />
            <label htmlFor="is_private" className="ml-2">Private group</label>
          </div>

          <div className="privateGroupInfo">
            {formData.is_private ? (
              <>
                <Lock size={22} />
                <p className="text-sm text-gray-500">Only approved members can join this group. You will be able to accept or reject requests.</p>
              </>
            ) : (
              <>
                <Unlock size={18}/>
                <p className="text-sm text-gray-500">Anyone can view and join this group.</p>
              </>
            )}
          </div>
        </div>

        <div className="buttons">
          <button
            type="submit"
            disabled={isSubmitting}
            className="createButton"
          >
            {isSubmitting ? 'Creating Group...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupForm;