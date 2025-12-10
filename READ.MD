subtitle={
          isEditMode && pristineRecord && pristineRecord.system_id !== parentSystem.id ? (
            <span className="text-red-100 bg-red-500 rounded-2xl px-2 py-1">
              ⚠️ Editing Physical Source: {pristineRecord.system_name}
            </span> // Alert user they are editing the remote end source
          ) : (
            `System: ${parentSystem.system_name}`
          )
        }