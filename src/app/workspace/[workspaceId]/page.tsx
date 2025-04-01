interface WorkspaceIdPageProps {
  params: {
    workspaceId: string;
  };
}

const WorkspaceIdPage = ({ params }: WorkspaceIdPageProps) => {
  return (
    <div>
      <h1>Workspace ID Page</h1>
      <p>This is the workspace ID page.</p>
      <p>Here you can manage your workspace.</p>
      ID:{params.workspaceId}
    </div>
  );
};

export default WorkspaceIdPage;
