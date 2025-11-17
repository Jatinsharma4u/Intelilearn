import React from 'react';
import { useParams } from 'react-router-dom';
import ExamSession from '../../components/classroom/ExamSession';

const ExamPage = () => {
  const { quizId } = useParams();

  return <ExamSession />;
};

export default ExamPage;