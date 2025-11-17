import React from 'react';

const Grid = ({ children, className = '', cols = 1, gap = 6, ...props }) => {
  const gridClasses = `
    grid 
    ${cols === 1 ? 'grid-cols-1' : 
      cols === 2 ? 'grid-cols-2' : 
      cols === 3 ? 'grid-cols-3' : 
      cols === 4 ? 'grid-cols-4' : 'grid-cols-1'}
    ${gap === 2 ? 'gap-2' : 
      gap === 4 ? 'gap-4' : 
      gap === 6 ? 'gap-6' : 
      gap === 8 ? 'gap-8' : 'gap-6'}
    ${className}
  `.trim();

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;