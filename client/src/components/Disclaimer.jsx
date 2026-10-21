export default function Disclaimer({ children }) {
  return (
    <div className="disclaimer" role="note">
      <strong>Not a medical diagnosis.</strong>{' '}
      {children || 'This tool gives general guidance only. Please consult a qualified doctor for medical advice.'}
    </div>
  );
}
