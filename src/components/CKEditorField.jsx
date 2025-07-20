import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default function CKEditorField({ value, onChange, placeholder }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        placeholder: placeholder || "Nhập nội dung...",
      }}
      onChange={(_, editor) => {
        const data = editor.getData();
        onChange(data);
      }}
    />
  );
}
