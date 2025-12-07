import React from 'react';
import { CareerPath } from '../types';

interface CareerCardProps {
  career: CareerPath;
  onStartInterview: (career: string) => void;
}

const CareerCard: React.FC<CareerCardProps> = ({ career, onStartInterview }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-xl font-bold text-slate-800">{career.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {career.matchScore}% Match
              </span>
              <span className="text-sm text-slate-500">{career.salaryRange}</span>
            </div>
          </div>
        </div>
        
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          {career.description}
        </p>

        <div className="mb-4">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Education</h5>
          <p className="text-sm text-slate-700 font-medium">{career.educationRequired}</p>
        </div>

        <div className="mb-6">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Roadmap</h5>
          <ul className="space-y-2">
            {career.roadmap.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onStartInterview(career.title)}
          className="w-full flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold py-2.5 px-4 rounded-lg transition-colors border border-brand-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Practice Interview
        </button>
      </div>
    </div>
  );
};

export default CareerCard;
