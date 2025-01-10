interface PdfPreviewProps {
  previewUrl: string;
  height?: string;
}

export const PdfPreview = ({
  previewUrl,
  height = "calc(100vh - 200px)",
}: PdfPreviewProps) => {
  return (
    <div
      className="pdf-preview"
      style={{
        flex: 1,
        width: "100%",
        minHeight: 0,
        marginBottom: "10px",
      }}
    >
      <iframe
        src={`${previewUrl}#view=FitV&zoom=page-fit&scrollbar=0&toolbar=0&navpanes=0`}
        width="100%"
        height={height}
        style={{
          width: "100%",
          height,
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
    </div>
  );
};
