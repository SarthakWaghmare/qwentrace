import Sidebar from './Sidebar';

const wrapStyle = {
  display: 'grid',
  gridTemplateColumns: '224px 1fr',
  height: '100vh',
  overflow: 'hidden',
};

const mainStyle = {
  overflowY: 'auto',
  padding: '32px',
};

export default function Layout({ children }) {
  return (
    <div style={wrapStyle}>
      <Sidebar />
      <main style={mainStyle}>{children}</main>
    </div>
  );
}
