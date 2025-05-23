"use client"

import { CalendarDays, Clock } from "lucide-react"
import qrcodeTest from "../assets/qrcode.png";
import { Check } from "lucide-react"

export function Header() {
  return (
    <div className="grid grid-cols-3 items-center gap-4 px-6">
      <div className="flex justify-start items-center ml-4">
        <img
          src="https://cardados.com.br/wp-content/uploads/2021/11/Imagem1-165x42.png"
          alt="Cardados Logo"
          className="h-auto w-[225px]"
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="bg-white rounded-lg p-2">
          <img
            src={qrcodeTest || "/placeholder.svg"}
            width={80}
            height={80}
          />
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="font-medium text-sm">ID: 20240151</span>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>28/08/2024</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>12:22</span>
          </div>
        </div>
        <div>
          <div className="inline-flex items-center w-[230px] h-[30px] bg-[#42db47] text-white rounded-[100px]">
            <div className="flex justify-between items-center w-full px-0.4">
              <span className="flex-grow text-sm font-bold text-center">APROVADO</span>
              <Check className="w-7 h-7 bg-[#489c49] rounded-full p-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

