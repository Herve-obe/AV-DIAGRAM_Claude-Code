import { readDiagramFile } from '../io/diagramRead'
import { pickFile } from '../io/pickFile'
import { notifyError } from '../io/files'
import { interpretDiagram } from '../model/diagramImport'
import { LIBRARY } from '../library'
import { useProject } from '../store/projectStore'
import { openDiagramSynoptic } from './PdfImportDialog'

export async function startDiagramImport(t:(key:string)=>string) {
  const id=useProject.getState().project.id
  try {
    const file=await pickFile(['drawio','xml','vsdx']);if(!file)return
    const pages=await readDiagramFile(file.data,file.name)
    if(useProject.getState().project.id!==id)return
    const parsed=pages.map((p,i)=>{const r=interpretDiagram(p,LIBRARY,i+1),warnings=p.warnings.map(w=>t(`diagramExchange.warnings.${w}`));return {...r,name:p.name,warnings}})
    openDiagramSynoptic(file.name,parsed)
  }catch(e){const code=e instanceof Error?e.message:'invalid';await notifyError(t(`diagramExchange.errors.${['large','timeout','unsafe'].includes(code)?code:'invalid'}`))}
}
