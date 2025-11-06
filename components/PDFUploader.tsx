'use client'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PDFUploader({ onUpload } : { onUpload?: (path: string)=>void }) {
	const [file, setFile] = useState<File|null>(null)
	const [loading, setLoading] = useState(false)
	const [dragOver, setDragOver] = useState(false)
	const inputRef = useRef<HTMLInputElement|null>(null)

	const handleUpload = async () => {
		if (!file) return alert('Select a PDF')
		setLoading(true)
		
		try {
			// Check if user is authenticated
			const { data: userData, error: authError } = await supabase.auth.getUser()
			if (authError) {
				console.error('Auth error:', authError)
				alert('Authentication error. Please log in again.')
				setLoading(false)
				return
			}
			
			const user = userData.user
			if (!user) {
				alert('Please log in to upload PDFs')
				setLoading(false)
				return
			}

			// Upload via server route (uses service role, bypasses RLS)
			const form = new FormData()
			form.append('file', file)
			form.append('user_id', user.id)
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: form
			})
			
			let json
			try {
				const text = await res.text()
				try {
					json = text ? JSON.parse(text) : {}
				} catch (parseError) {
					console.error('Failed to parse JSON response:', parseError, 'Response text:', text)
					throw new Error(`Server returned invalid response: ${res.status} ${res.statusText}`)
				}
			} catch (fetchError: any) {
				console.error('Failed to read response:', fetchError)
				throw new Error(`Network error: ${fetchError?.message || 'Failed to communicate with server'}`)
			}
			
			if (!res.ok) {
				// Log the full response for debugging
				console.error('Upload API error response:', json)
				console.error('Response status:', res.status, res.statusText)
				
				// Helper function to safely extract error message from response
				const extractErrorFromResponse = (resp: any): string => {
					if (!resp) return 'Upload failed: Server returned an error'
					
					// Check for error property
					if (resp.error !== undefined) {
						const err = resp.error
						if (typeof err === 'string' && err) return err
						if (err && typeof err === 'object') {
							if (err.message && typeof err.message === 'string') return err.message
							if (err.error && typeof err.error === 'string') return err.error
							if (err.statusText && typeof err.statusText === 'string') return err.statusText
							// Try to find any string property
							for (const key in err) {
								if (typeof err[key] === 'string' && err[key] && key !== 'toString') {
									return err[key]
								}
							}
							// Last resort: try JSON.stringify
							try {
								const str = JSON.stringify(err)
								if (str && str !== '{}' && str !== 'null') return str
							} catch {}
						}
					}
					
					// Check for message property
					if (resp.message && typeof resp.message === 'string') return resp.message
					
					// Check for statusText
					if (resp.statusText && typeof resp.statusText === 'string') return resp.statusText
					
					return `Upload failed: Server error (${res.status})`
				}
				
				const errorMessage = extractErrorFromResponse(json)
				throw new Error(errorMessage)
			}

			alert('PDF uploaded successfully!')
			onUpload && onUpload(json.path)
		} catch (error: any) {
			console.error('Upload error (full object):', error)
			console.error('Upload error (type):', typeof error)
			console.error('Upload error (keys):', error && typeof error === 'object' ? Object.keys(error) : 'N/A')
			
			// Helper function to safely extract error message from any error type
			const extractErrorMessage = (err: any): string => {
				// Handle null/undefined
				if (!err) return 'Upload failed: Unknown error occurred'
				
				// Handle string errors
				if (typeof err === 'string' && err.trim()) return err.trim()
				
				// Handle Error instances
				if (err instanceof Error) {
					if (err.message && err.message.trim()) return err.message.trim()
					return 'Upload failed: An error occurred'
				}
				
				// Handle objects
				if (err && typeof err === 'object') {
					// Check common error message properties
					const messageProps = ['message', 'error', 'statusText', 'detail', 'description']
					for (const prop of messageProps) {
						if (err[prop] && typeof err[prop] === 'string' && err[prop].trim()) {
							return err[prop].trim()
						}
					}
					
					// Check for nested error objects
					if (err.error && typeof err.error === 'object') {
						const nested = extractErrorMessage(err.error)
						if (nested && !nested.includes('Unknown error')) return nested
					}
					
					// Try to find any string property (excluding methods)
					for (const key in err) {
						if (err.hasOwnProperty(key) && typeof err[key] === 'string' && err[key].trim() && key !== 'toString') {
							return err[key].trim()
						}
					}
					
					// Last resort: try JSON.stringify (but check if meaningful)
					try {
						const stringified = JSON.stringify(err, null, 2)
						if (stringified && stringified !== '{}' && stringified !== 'null' && stringified !== '""') {
							// If it's a reasonable size, return it (truncate if too long)
							return stringified.length > 300 ? stringified.substring(0, 300) + '...' : stringified
						}
					} catch (stringifyError) {
						// JSON.stringify failed, continue to default
						console.error('JSON.stringify failed:', stringifyError)
					}
				}
				
				// Absolute last resort: convert to string (but this should rarely happen)
				try {
					const str = String(err)
					if (str && str !== '[object Object]' && str !== 'null' && str !== 'undefined') {
						return str
					}
				} catch {}
				
				return 'Upload failed: An unexpected error occurred. Please check the console for details.'
			}
			
			const errorMessage = extractErrorMessage(error)
			console.error('Final extracted error message:', errorMessage)
			alert(`Upload failed: ${errorMessage}`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm'>
			<div className='text-sm font-semibold text-slate-900 mb-2'>Upload PDF</div>
			<div
				onDragOver={(e)=>{ e.preventDefault(); setDragOver(true) }}
				onDragLeave={()=> setDragOver(false)}
				onDrop={(e)=>{
					e.preventDefault();
					setDragOver(false)
					const f = e.dataTransfer.files?.[0]
					if (f) {
						if (f.type !== 'application/pdf') { alert('Please drop a PDF'); return }
						setFile(f)
					}
				}}
				className={[
					'group relative rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer',
					dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 bg-white/70'
				].join(' ')}
				onClick={()=> inputRef.current?.click()}
			>
				<input
					ref={inputRef}
					type='file'
					accept='application/pdf'
					className='hidden'
					onChange={e=> setFile(e.target.files?.[0] ?? null)}
				/>
				<div className='flex items-center gap-3 text-slate-700'>
					<div className='inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white'>
						<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><path d='M12 16V4M12 4l-4 4M12 4l4 4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/><path d='M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2' stroke='currentColor' strokeWidth='2' strokeLinecap='round'/></svg>
					</div>
					<div>
						<div className='font-medium'>Drag & drop your PDF</div>
						<div className='text-xs text-slate-500'>or click to choose a file</div>
					</div>
				</div>
			</div>

			{file && (
				<div className='mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3'>
					<div className='text-sm text-slate-700 truncate'>
						<span className='font-medium text-slate-900'>Selected:</span> {file.name}
					</div>
					<button
						className='text-xs text-slate-600 hover:text-slate-800'
						onClick={()=> setFile(null)}
					>
						Clear
					</button>
				</div>
			)}

			<div className='mt-4'>
				<button 
					className='bg-slate-900 text-white px-4 py-2 rounded-lg disabled:opacity-50' 
					onClick={handleUpload} 
					disabled={loading || !file}
					data-pdf-action="upload">
					{loading ? 'Uploading…' : 'Upload & Add to Reader'}
				</button>
			</div>
		</div>
	)
}
