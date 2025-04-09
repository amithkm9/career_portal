import { CounselorLayout } from "@/components/layouts/counselor-layout"

export default function UploadReportLoading() {
  return (
    <CounselorLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-700 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-gray-700 rounded-md animate-pulse"></div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-700 rounded-md mb-6"></div>
          <div className="space-y-6">
            <div>
              <div className="h-4 w-32 bg-gray-700 rounded-md mb-2"></div>
              <div className="h-10 w-full bg-gray-700 rounded-md"></div>
            </div>
            <div>
              <div className="h-4 w-32 bg-gray-700 rounded-md mb-2"></div>
              <div className="h-32 w-full bg-gray-700 rounded-md"></div>
            </div>
            <div>
              <div className="h-4 w-48 bg-gray-700 rounded-md mb-2"></div>
              <div className="h-40 w-full bg-gray-700 rounded-md"></div>
            </div>
            <div className="h-10 w-full bg-gray-700 rounded-md"></div>
          </div>
        </div>
      </div>
    </CounselorLayout>
  )
}

