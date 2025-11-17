import React from 'react';

const Stepper = ({ steps, currentStep, onChangeStep }) => {
  return (
    <div className="stepper">
      <div className="stepper-steps">
        {steps.map((step, index) => (
          <div
            key={step.value}
            className={`step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
          >
            <div className="step-circle">
              {index < currentStep ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-number">{index + 1}</span>
              )}
            </div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className="step-connector" />
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .stepper {
          width: 100%;
        }
        
        .stepper-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 8px;
          z-index: 2;
          transition: all 0.3s ease;
        }
        
        .step:not(.completed):not(.active) .step-circle {
          background: #2A2A3D;
          color: #A0A0B8;
          border: 2px solid #2A2A3D;
        }
        
        .step.active .step-circle {
          background: #0082FB;
          color: #FFFFFF;
          border: 2px solid #0082FB;
          box-shadow: 0 0 0 4px rgba(0, 130, 251, 0.2);
        }
        
        .step.completed .step-circle {
          background: #00FFA3;
          color: #0D0D14;
          border: 2px solid #00FFA3;
        }
        
        .step-check {
          font-size: 16px;
          font-weight: bold;
        }
        
        .step-number {
          font-size: 14px;
        }
        
        .step-content {
          text-align: center;
        }
        
        .step-title {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .step.active .step-title {
          color: #0082FB;
        }
        
        .step.completed .step-title {
          color: #00FFA3;
        }
        
        .step-description {
          color: #A0A0B8;
          font-size: 12px;
        }
        
        .step-connector {
          position: absolute;
          top: 20px;
          left: 50%;
          right: -50%;
          height: 2px;
          background: #2A2A3D;
          z-index: 1;
        }
        
        .step.completed .step-connector {
          background: #00FFA3;
        }
        
        @media (max-width: 768px) {
          .step-content {
            display: none;
          }
          
          .step-circle {
            width: 32px;
            height: 32px;
          }
          
          .step-connector {
            top: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Stepper;