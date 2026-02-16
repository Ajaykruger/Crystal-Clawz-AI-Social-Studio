
import React from 'react';
import { DraftState, ViewState } from '../types';
import OptionsChooser from './OptionsChooser';
import EditorStudio from './EditorStudio';

interface WorkbenchProps {
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onSave: () => void;
  onNavigate: (view: ViewState, params?: any) => void;
}

const Workbench: React.FC<WorkbenchProps> = ({ draft, setDraft, onSave, onNavigate }) => {
  // If no option has been selected from the generated ideas, show the chooser
  if (!draft.selectedOptionId) {
    return (
      <div className="bg-slate-50 dark:bg-gray-900 min-h-full transition-colors duration-300">
        <OptionsChooser 
            draft={draft} 
            setDraft={setDraft} 
            onSelect={() => {}} 
        />
      </div>
    );
  }

  // Otherwise, show the editor studio which handles its own full-height layout
  return (
    <EditorStudio 
      draft={draft} 
      setDraft={setDraft} 
      onNext={onSave} 
      onNavigate={onNavigate}
    />
  );
};

export default Workbench;
